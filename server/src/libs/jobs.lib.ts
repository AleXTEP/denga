import { JobsDB } from '../databases/mongodb';
import { ObjectId } from 'mongodb';
import { Filter } from '../models/filter';
const agenda = require('./agenda.lib');


const Config = require('conf');
const settings = new Config();
export class JobsLib {

	async getAll(filter: Filter) {
		let dbFilter: any = {};
		if (filter.search_string) {
			dbFilter = { $and: [] }
			dbFilter.$and.push({
				name:
				{
					$regex: filter.search_string,
					$options: 'i'
				}
			})
		}

		try {
			let res = await JobsDB().find(dbFilter).limit(settings.get('limit')).toArray()
			res = res.map(c => {
				c._id = c._id.toString()
				return c
			})
			return res
		} catch (error) {
			throw error;
		}
	}

	async remove(param) {
		let idsList = param.ids.map(i => new ObjectId(i))
		try {
			let res = await JobsDB().deleteMany({
				_id: { $in: idsList }
			});
			return res
		} catch (error) {
			throw error;
		}
	}

	async requeue(param) {
		let idsList = param.ids.map(i => new ObjectId(i))
		let jobs = await JobsDB().find({
			_id: { $in: idsList }
		}).toArray();

		for (const job of jobs) {
			agenda.now(job.name, job.data)
		}
		return {}
	}

}
